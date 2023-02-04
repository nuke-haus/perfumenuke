class TickBox extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const className = this.props.ticked === true
            ? "tag clickabletag selectedtag"
            : "tag clickabletag";
        const text = isSelected
            ? "🟢 " + this.props.label
            : "⚫ " + this.props.label;
        return (
            <div className={className} 
                 onClick={() => this.props.onClick(!this.props.ticked)}>
                    {text}
            </div>
        );
    }
}

TickBox.defaultProps = {
    ticked: false,
    onClick: () => {}
}