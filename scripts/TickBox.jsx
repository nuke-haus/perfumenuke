class TickBox extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const className = this.props.ticked === true
            ? "tag clickabletag selectedtag"
            : "tag clickabletag";
        const text = this.props.ticked === true
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