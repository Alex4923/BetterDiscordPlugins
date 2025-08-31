/**
 * @name ScheduledMessage
 * @description Plugin to schedule message sending.
 * @version 2.3.0
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
const CURRENT_VERSION = "2.3.0";
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

class CustomCalendar extends React.Component {
    constructor(props) {
        super(props);
        
        const today = new Date();
        this.state = {
            currentMonth: today.getMonth(),
            currentYear: today.getFullYear(),
            selectedDate: props.selectedDate ? new Date(props.selectedDate) : null,
            isVisible: false,
            hoveredDate: null
        };
        
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        this.dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    }

    componentDidMount() {
        setTimeout(() => this.setState({ isVisible: true }), 50);
    }

    getDaysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }

    getFirstDayOfMonth(month, year) {
        return new Date(year, month, 1).getDay();
    }

    handleDateClick = (day) => {
        const selectedDate = new Date(this.state.currentYear, this.state.currentMonth, day);
        this.setState({ selectedDate });
        if (this.props.onDateSelect) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const dayStr = String(selectedDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${dayStr}`;
            this.props.onDateSelect(dateString);
        }
    }

    handlePrevMonth = () => {
        let { currentMonth, currentYear } = this.state;
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        this.setState({ currentMonth, currentYear });
    }

    handleNextMonth = () => {
        let { currentMonth, currentYear } = this.state;
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        this.setState({ currentMonth, currentYear });
    }

    isToday = (day) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            this.state.currentMonth === today.getMonth() &&
            this.state.currentYear === today.getFullYear()
        );
    }

    isSelected = (day) => {
        if (!this.state.selectedDate) return false;
        return (
            day === this.state.selectedDate.getDate() &&
            this.state.currentMonth === this.state.selectedDate.getMonth() &&
            this.state.currentYear === this.state.selectedDate.getFullYear()
        );
    }

    isPastDate = (day) => {
        const today = new Date();
        const checkDate = new Date(this.state.currentYear, this.state.currentMonth, day);
        today.setHours(0, 0, 0, 0);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    }

    render() {
        const { currentMonth, currentYear, isVisible, hoveredDate } = this.state;
        const daysInMonth = this.getDaysInMonth(currentMonth, currentYear);
        const firstDay = this.getFirstDayOfMonth(currentMonth, currentYear);

        const calendarStyle = {
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            backgroundColor: '#2f3136',
            border: '2px solid #5865f2',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 8px 32px rgba(88, 101, 242, 0.4)',
            zIndex: '99999', 
            padding: '20px',
            marginTop: '8px',
            transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(-10px)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            fontFamily: "Whitney, 'Helvetica Neue', Helvetica, Arial, sans-serif"
        };

        const headerStyle = {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '0 8px'
        };

        const monthYearStyle = {
            fontSize: '18px',
            fontWeight: '700',
            color: '#dcddde',
            background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center',
            flex: 1
        };

        const navButtonStyle = {
            background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
            border: 'none',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(88, 101, 242, 0.3)'
        };

        const daysHeaderStyle = {
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            marginBottom: '12px'
        };

        const dayHeaderStyle = {
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: '600',
            color: '#8e9297',
            padding: '6px 2px',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
        };

        const daysGridStyle = {
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px'
        };

        const days = [];
        
        for (let i = 0; i < firstDay; i++) {
            days.push(
                React.createElement('div', {
                    key: `empty-${i}`,
                    style: { height: '40px' }
                })
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isSelectedDay = this.isSelected(day);
            const isTodayDay = this.isToday(day);
            const isPastDay = this.isPastDate(day);
            const isHovered = hoveredDate === day;

            let dayStyle = {
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                cursor: isPastDay ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
            };

            if (isPastDay) {
                dayStyle = {
                    ...dayStyle,
                    color: '#4f545c',
                    backgroundColor: '#32353b'
                };
            } else if (isSelectedDay) {
                dayStyle = {
                    ...dayStyle,
                    background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
                    color: 'white',
                    boxShadow: '0 6px 20px rgba(88, 101, 242, 0.5)',
                    transform: 'scale(1.05)'
                };
            } else if (isTodayDay) {
                dayStyle = {
                    ...dayStyle,
                    backgroundColor: 'rgba(88, 101, 242, 0.2)',
                    color: '#5865f2',
                    border: '2px solid #5865f2'
                };
            } else {
                dayStyle = {
                    ...dayStyle,
                    color: '#dcddde',
                    backgroundColor: isHovered ? 'rgba(88, 101, 242, 0.1)' : 'transparent'
                };
            }

            if (isHovered && !isPastDay && !isSelectedDay) {
                dayStyle.transform = 'scale(1.1)';
                dayStyle.backgroundColor = 'rgba(88, 101, 242, 0.2)';
                dayStyle.boxShadow = '0 4px 12px rgba(88, 101, 242, 0.3)';
            }

            days.push(
                React.createElement('div', {
                    key: day,
                    style: dayStyle,
                    onClick: isPastDay ? null : () => this.handleDateClick(day),
                    onMouseEnter: () => !isPastDay && this.setState({ hoveredDate: day }),
                    onMouseLeave: () => this.setState({ hoveredDate: null })
                }, day)
            );
        }

        return React.createElement('div', { style: calendarStyle }, [
            React.createElement('div', { key: 'header', style: headerStyle }, [
                React.createElement('button', {
                    key: 'prev',
                    style: navButtonStyle,
                    onClick: this.handlePrevMonth,
                    onMouseEnter: (e) => {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.filter = 'brightness(1.2)';
                    },
                    onMouseLeave: (e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.filter = 'brightness(1)';
                    }
                }, '‹'),
                React.createElement('div', {
                    key: 'month-year',
                    style: monthYearStyle
                }, `${this.monthNames[currentMonth]} ${currentYear}`),
                React.createElement('button', {
                    key: 'next',
                    style: navButtonStyle,
                    onClick: this.handleNextMonth,
                    onMouseEnter: (e) => {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.filter = 'brightness(1.2)';
                    },
                    onMouseLeave: (e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.filter = 'brightness(1)';
                    }
                }, '›')
            ]),
            React.createElement('div', { key: 'days-header', style: daysHeaderStyle },
                this.dayNames.map((dayName, index) => 
                    React.createElement('div', {
                        key: dayName,
                        style: dayHeaderStyle
                    }, dayName)
                )
            ),
            React.createElement('div', { key: 'days-grid', style: daysGridStyle }, days)
        ]);
    }
}

class CustomTimePicker extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            isVisible: false,
            selectedHour: props.selectedTime ? parseInt(props.selectedTime.split(':')[0]) : 12,
            selectedMinute: props.selectedTime ? parseInt(props.selectedTime.split(':')[1]) : 0,
            hoveredHour: null,
            hoveredMinute: null
        };
    }

    componentDidMount() {
        setTimeout(() => this.setState({ isVisible: true }), 50);
    }

    handleHourClick = (hour) => {
        this.setState({ selectedHour: hour }, () => {
            this.updateTime();
        });
    }

    handleMinuteClick = (minute) => {
        this.setState({ selectedMinute: minute }, () => {
            this.updateTime();
        });
    }

    updateTime = () => {
        const { selectedHour, selectedMinute } = this.state;
        const timeString = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
        if (this.props.onTimeSelect) {
            this.props.onTimeSelect(timeString);
        }
    }

    render() {
        const { isVisible, selectedHour, selectedMinute, hoveredHour, hoveredMinute } = this.state;

        const timePickerStyle = {
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            backgroundColor: '#2f3136',
            border: '2px solid #5865f2',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 8px 32px rgba(88, 101, 242, 0.4)',
            zIndex: '99999',
            padding: '20px',
            marginTop: '8px',
            transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(-10px)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            fontFamily: "Whitney, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            display: 'flex',
            gap: '20px',
            maxHeight: '300px'
        };

        const sectionStyle = {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        };

        const titleStyle = {
            fontSize: '14px',
            fontWeight: '700',
            color: '#dcddde',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        };

        const timeGridStyle = {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            width: '100%'
        };

        const minuteGridStyle = {
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '4px',
            width: '100%',
            maxHeight: '200px',
            overflowY: 'auto',
            paddingRight: '8px'
        };

        const hours = [];
        for (let hour = 0; hour < 24; hour++) {
            const isSelected = hour === selectedHour;
            const isHovered = hour === hoveredHour;

            let hourStyle = {
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
            };

            if (isSelected) {
                hourStyle = {
                    ...hourStyle,
                    background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(88, 101, 242, 0.5)',
                    transform: 'scale(1.05)'
                };
            } else {
                hourStyle = {
                    ...hourStyle,
                    color: '#dcddde',
                    backgroundColor: isHovered ? 'rgba(88, 101, 242, 0.2)' : 'transparent'
                };
            }

            if (isHovered && !isSelected) {
                hourStyle.transform = 'scale(1.1)';
                hourStyle.backgroundColor = 'rgba(88, 101, 242, 0.2)';
                hourStyle.boxShadow = '0 2px 8px rgba(88, 101, 242, 0.3)';
            }

            hours.push(
                React.createElement('div', {
                    key: hour,
                    style: hourStyle,
                    onClick: () => this.handleHourClick(hour),
                    onMouseEnter: () => this.setState({ hoveredHour: hour }),
                    onMouseLeave: () => this.setState({ hoveredHour: null })
                }, String(hour).padStart(2, '0'))
            );
        }

        const minutes = [];
        for (let minute = 0; minute < 60; minute++) {
            const isSelected = minute === selectedMinute;
            const isHovered = minute === hoveredMinute;

            let minuteStyle = {
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
            };

            if (isSelected) {
                minuteStyle = {
                    ...minuteStyle,
                    background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(88, 101, 242, 0.5)',
                    transform: 'scale(1.05)'
                };
            } else {
                minuteStyle = {
                    ...minuteStyle,
                    color: '#dcddde',
                    backgroundColor: isHovered ? 'rgba(88, 101, 242, 0.2)' : 'transparent'
                };
            }

            if (isHovered && !isSelected) {
                minuteStyle.transform = 'scale(1.1)';
                minuteStyle.backgroundColor = 'rgba(88, 101, 242, 0.2)';
                minuteStyle.boxShadow = '0 2px 8px rgba(88, 101, 242, 0.3)';
            }

            minutes.push(
                React.createElement('div', {
                    key: minute,
                    style: minuteStyle,
                    onClick: () => this.handleMinuteClick(minute),
                    onMouseEnter: () => this.setState({ hoveredMinute: minute }),
                    onMouseLeave: () => this.setState({ hoveredMinute: null })
                }, String(minute).padStart(2, '0'))
            );
        }

        return React.createElement('div', { style: timePickerStyle }, [
            React.createElement('div', { key: 'hours-section', style: sectionStyle }, [
                React.createElement('div', { key: 'hours-title', style: titleStyle }, 'Hours'),
                React.createElement('div', { key: 'hours-grid', style: timeGridStyle }, hours)
            ]),
            React.createElement('div', { key: 'minutes-section', style: sectionStyle }, [
                React.createElement('div', { key: 'minutes-title', style: titleStyle }, 'Minutes'),
                React.createElement('div', { key: 'minutes-grid', style: minuteGridStyle }, minutes)
            ])
        ]);
    }
}

class CustomModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            message: "", 
            date: "", 
            time: "", 
            isVisible: false,
            showCalendar: false,
            showTimePicker: false
        };
    }

    componentDidMount() {
        requestAnimationFrame(() => {
            this.setState({ isVisible: true });
        });
    }

    componentWillUnmount() {
    }

    handleModalClick = (e) => {
        const isCalendarClick = e.target.closest('.calendar-container');
        const isTimePickerClick = e.target.closest('.time-picker-container');
        
        if (!isCalendarClick && this.state.showCalendar) {
            this.setState({ showCalendar: false });
        }
        
        if (!isTimePickerClick && this.state.showTimePicker) {
            this.setState({ showTimePicker: false });
        }
    }

    handleInputChange = (event) => {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    }

    handleDateSelect = (dateString) => {
        this.setState({ 
            date: dateString,
            showCalendar: false
        });
    }

    handleTimeSelect = (timeString) => {
        this.setState({ 
            time: timeString,
            showTimePicker: false
        });
    }

    handleDateFieldClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ showCalendar: !this.state.showCalendar, showTimePicker: false });
    }

    handleTimeFieldClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ showTimePicker: !this.state.showTimePicker, showCalendar: false });
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
            BdApi.UI.showToast("Message scheduled successfully", { type: "success" });
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
            overflow: "visible",
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
            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.05)",
            zIndex: "10002" 
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
            transition: "all 0.2s ease",
            position: "relative",
            borderRadius: "8px",
            padding: "0",
            zIndex: (this.state.showCalendar || this.state.showTimePicker) ? "50000" : "auto"
        };

        const customDateInputStyle = {
            ...inputStyle,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #40444b 0%, #36393f 100%)",
            border: this.state.showCalendar ? "2px solid #5865f2" : "2px solid #4f545c",
            zIndex: "auto" 
        };

        const customTimeInputStyle = {
            ...inputStyle,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #40444b 0%, #36393f 100%)",
            border: this.state.showTimePicker ? "2px solid #5865f2" : "2px solid #4f545c",
            zIndex: "auto"
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

        const formatDisplayDate = (dateStr) => {
            if (!dateStr) return 'Select a date';
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const formatDisplayTime = (timeStr) => {
            if (!timeStr) return 'Select a time';
            const [hours, minutes] = timeStr.split(':');
            return `${hours}:${minutes}`;
        };

        return React.createElement("div", { 
            style: modalStyle, 
            onClick: this.handleClose 
        },
            React.createElement("div", { 
                style: containerStyle, 
                onClick: (e) => {
                    e.stopPropagation(); 
                    this.handleModalClick(e); 
                }
            }, [
                React.createElement("div", { 
                    key: "header",
                    style: headerStyle 
                }, [
                    React.createElement("h2", { 
                        key: "title",
                        style: titleStyle 
                    }, "Schedule a message"),
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
                                style: { position: "relative" },
                                className: "calendar-container",
                                onClick: (e) => e.stopPropagation()
                            }, [
                                React.createElement("div", {
                                    key: "custom-date-input",
                                    style: customDateInputStyle,
                                    onClick: this.handleDateFieldClick
                                }, [
                                    React.createElement("span", {
                                        key: "date-text"
                                    }, formatDisplayDate(this.state.date)),
                                    React.createElement("span", {
                                        key: "calendar-icon",
                                        style: {
                                            fontSize: '18px',
                                            color: '#5865f2',
                                            marginLeft: '8px'
                                        }
                                    }, "📅")
                                ]),
                                this.state.showCalendar && React.createElement(CustomCalendar, {
                                    key: "calendar",
                                    selectedDate: this.state.date,
                                    onDateSelect: this.handleDateSelect
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
                                style: { position: "relative" },
                                className: "time-picker-container",
                                onClick: (e) => e.stopPropagation()
                            }, [
                                React.createElement("div", {
                                    key: "custom-time-input",
                                    style: customTimeInputStyle,
                                    onClick: this.handleTimeFieldClick
                                }, [
                                    React.createElement("span", {
                                        key: "time-text"
                                    }, formatDisplayTime(this.state.time)),
                                    React.createElement("span", {
                                        key: "clock-icon",
                                        style: {
                                            fontSize: '18px',
                                            color: '#5865f2',
                                            marginLeft: '8px'
                                        }
                                    }, "🕐")
                                ]),
                                this.state.showTimePicker && React.createElement(CustomTimePicker, {
                                    key: "time-picker",
                                    selectedTime: this.state.time,
                                    onTimeSelect: this.handleTimeSelect
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
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        @keyframes pulseGlow {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(88, 101, 242, 0.4);
            }
            50% {
                box-shadow: 0 0 0 10px rgba(88, 101, 242, 0.1);
            }
        }
        
        #scheduled-message-button {
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        }
        
        #scheduled-message-button:hover {
            transform: scale(1.15) !important;
            color: #5865f2 !important;
            filter: drop-shadow(0 0 8px rgba(88, 101, 242, 0.5));
        }
        
        #custom-modal-container .field-container {
            transition: all 0.2s ease !important;
            position: relative !important;
        }
        
        #custom-modal-container .field-container:hover {
            transform: translateY(-1px);
        }
        
        #custom-modal-container [style*="cursor: pointer"]:hover {
            border-color: #5865f2 !important;
            box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.3), 0 4px 12px rgba(88, 101, 242, 0.2) !important;
            transform: translateY(-2px) !important;
            z-index: initial !important; 
        }
        
        #custom-modal-container [style*="position: absolute"][style*="backgroundColor: #2f3136"] {
            animation: slideDown 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        }
        
        #custom-modal-container .calendar-container {
            z-index: 50000 !important;
            position: relative !important;
        }
        
        #custom-modal-container .calendar-container > div[style*="position: absolute"] {
            z-index: 99999 !important;
        }
        
        #custom-modal-container .time-picker-container {
            z-index: 50000 !important;
            position: relative !important;
        }
        
        #custom-modal-container .time-picker-container > div[style*="position: absolute"] {
            z-index: 99999 !important;
        }
        
        #custom-modal-container *::-webkit-scrollbar {
            width: 8px;
        }
        
        #custom-modal-container *::-webkit-scrollbar-track {
            background: rgba(32, 34, 37, 0.6);
            border-radius: 4px;
        }
        
        #custom-modal-container *::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #5865f2 0%, #7289da 100%);
            border-radius: 4px;
            transition: background 0.3s ease;
        }
        
        #custom-modal-container *::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #4752c4 0%, #5865f2 100%);
            box-shadow: 0 0 6px rgba(88, 101, 242, 0.4);
        }
        
        #custom-modal-container *::-webkit-scrollbar-thumb:active {
            background: linear-gradient(135deg, #3c45a5 0%, #4752c4 100%);
        }
        
        #custom-modal-container * {
            scrollbar-width: thin;
            scrollbar-color: #5865f2 rgba(32, 34, 37, 0.6);
        }
        
        #custom-modal-container [style*="display: grid"][style*="repeat(7, 1fr)"] > div {
            transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        }
        
        #custom-modal-container [style*="background: linear-gradient(135deg, #5865f2"] {
            animation: pulseGlow 2s infinite !important;
        }
        
        #custom-modal-container input:focus,
        #custom-modal-container textarea:focus {
            border-color: #5865f2 !important;
            box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2) !important;
            transform: translateY(-1px);
        }
        
        #custom-modal-container input[type="time"] {
            position: relative !important;
            z-index: 10002 !important;
        }
        
        #custom-modal-container input[type="time"]:hover {
            border-color: #5865f2 !important;
            box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.2) !important;
            transform: translateY(-1px);
        }
        
        #custom-modal-container input[type="time"]::-webkit-calendar-picker-indicator,
        #custom-modal-container input[type="time"]::-webkit-datetime-edit {
            z-index: 10003 !important;
            position: relative !important;
        }
        
        #custom-modal-container button:not(:disabled):hover {
            transform: translateY(-2px);
            filter: brightness(1.1);
        }
        
        #custom-modal-container .close-btn:hover {
            background: rgba(255, 255, 255, 0.25) !important;
            transform: rotate(90deg) scale(1.1);
        }
        
        #custom-modal-container .submit-btn:not(:disabled) {
            animation: gradientShift 3s ease infinite;
        }
        
        #custom-modal-container .submit-btn:not(:disabled):hover {
            box-shadow: 0 8px 25px rgba(88, 101, 242, 0.6), 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        
        #custom-modal-container input[type="date"]::-webkit-calendar-picker-indicator {
            display: none;
        }
        
        #custom-modal-container input[type="date"] {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
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
            top: 52px;
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
        this.updateIntervalId = setInterval(() => this.checkForUpdates(), 6 * 60 * 60 * 1000); 
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